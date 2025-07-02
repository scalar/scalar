"""
Simple test to verify that all imports work correctly.
This is useful for catching import issues early.
"""

import pytest


def test_scalar_fastapi_imports():
    """Test that all scalar_fastapi imports work correctly"""
    
    # Test main function import
    from scalar_fastapi import get_scalar_api_reference
    assert callable(get_scalar_api_reference)
    
    # Test enum imports
    from scalar_fastapi import Layout, SearchHotKey
    assert Layout.MODERN.value == "modern"
    assert Layout.CLASSIC.value == "classic"
    assert SearchHotKey.K.value == "k"
    assert SearchHotKey.A.value == "a"
    assert SearchHotKey.Z.value == "z"


def test_fastapi_imports():
    """Test that FastAPI imports work correctly"""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from fastapi.responses import HTMLResponse
    
    # Verify we can create a FastAPI app
    app = FastAPI()
    assert app is not None
    
    # Verify we can create a test client
    client = TestClient(app)
    assert client is not None


def test_pytest_imports():
    """Test that pytest imports work correctly"""
    import pytest
    
    # Verify pytest is available
    assert pytest is not None


def test_typing_imports():
    """Test that typing imports work correctly"""
    from typing_extensions import Annotated, Doc
    
    # Verify typing extensions are available
    assert Annotated is not None
    assert Doc is not None 
