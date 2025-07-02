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
    name='scalar_fastapi',
    version=get_version(),
    packages=find_packages(),
    install_requires=[],
    author='Marc Laventure',
    author_email='marc@scalar.com',
    description='This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with FastAPI.',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    url='https://github.com/scalar/scalar',
)
