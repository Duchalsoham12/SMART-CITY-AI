"""
SmartCityAI - Datasets REST Router
Endpoints for dataset catalog listing, file upload, preflight quality validation,
smart column mapping inspection, and sample record retrieval.
"""

import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from backend.schemas.api_schemas import (
    ColumnMappingItem,
    DatasetSummary,
    DatasetUploadResponse,
)
from backend.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["Dataset Management & Ingestion"])


@router.get("", response_model=List[DatasetSummary], summary="List all registered datasets")
def get_datasets():
    """Lists all registered dataset catalogs with row counts, version IDs, and quality scores."""
    return DatasetService.list_datasets()


@router.post(
    "/upload",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest a dataset file (CSV, XLSX, JSON)",
)
async def upload_dataset(
    file: UploadFile = File(..., description="Telemetry dataset file (.csv, .xlsx, .json)"),
    category: str = Form("traffic", description="Dataset domain: traffic, accidents, air_quality, custom"),
    custom_name: Optional[str] = Form(None, description="Optional custom identifier name"),
    column_mapping_json: Optional[str] = Form(None, description="JSON string of source-to-target column renames"),
):
    """
    Ingests a raw telemetry file, executes preflight data quality validation,
    creates a deterministic SHA-256 version manifest, quarantines non-conforming rows,
    and registers the dataset for model training and spatial mapping.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    column_mapping = None
    if column_mapping_json:
        try:
            column_mapping = json.loads(column_mapping_json)
        except Exception:
            raise HTTPException(status_code=400, detail="column_mapping_json is not valid JSON.")

    try:
        response = DatasetService.validate_and_process_upload(
            file_bytes=content,
            filename=file.filename,
            category=category,
            custom_name=custom_name,
            column_mapping=column_mapping,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Dataset processing error: {str(e)}")


@router.post(
    "/inspect",
    response_model=List[ColumnMappingItem],
    summary="Inspect file columns and detect semantic mappings",
)
async def inspect_file_columns(
    file: UploadFile = File(..., description="File to inspect for columns"),
):
    """
    Inspects source columns in an uploaded file and returns automatic semantic
    mapping recommendations with confidence scores and sample values.
    """
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        df = DatasetService.parse_file(content, file.filename or "data.csv")
        return DatasetService.detect_column_mappings(df)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"File inspection error: {str(e)}")


@router.get(
    "/{dataset_name}/sample",
    response_model=List[Dict[str, Any]],
    summary="Get preview sample records of a dataset",
)
def get_dataset_sample(dataset_name: str, limit: int = 10):
    """Returns top sample rows from a registered dataset."""
    return DatasetService.get_sample_records(dataset_name, limit=limit)
