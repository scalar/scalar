import json
import os
from setuptools import setup, find_packages

# Read version from package.json
def get_version():
    package_json_path = os.path.join(os.path.dirname(__file__), 'package.json')
    with open(package_json_path, 'r') as f:
        package_data = json.load(f)
    return package_data['version']

setup(
    name='scalar-api-reference',
    version=get_version(),
    packages=find_packages(exclude=["tests"]),
    install_requires=[
        "pydantic>=2.0",
    ],
    author='Scalar',
    author_email='support@scalar.com',
    description='Shared Python library for rendering Scalar API Reference documentation from OpenAPI files.',
    long_description=open('README.md').read() if os.path.exists('README.md') else '',
    long_description_content_type='text/markdown',
    url='https://github.com/scalar/scalar',
)
