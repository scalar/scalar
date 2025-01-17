from setuptools import setup, find_packages

setup(
    name='scalar_fastapi',
    version='1.0.1',
    packages=find_packages(),
    install_requires=[
        # Add your package dependencies here
    ],
    author='Marc Laventure',
    author_email='marc@scalar.com',
    description='This plugin provides an easy way to render a beautiful API reference based on a OpenAPI/Swagger file with FastAPI.',
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    url='https://github.com/scalar/scalar',
    # classifiers=[
    # ],
)
