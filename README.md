# Pythia Reference Manager

Pythia is a reference manager for scientific references.
The standard use-case are queries on Pubmed from where results are stored
in a local database for usage in a local Mediawiki instance.
There are links to a local PDF-Repository maintained which are included in 
the Mediawiki references, so readers can access the PDF's direct from within
articles.

Currently, there is no support for different users.

 - **Pythia** is named after Oracle of Delphi.
 - **Pythia** is a NodeJs Server (based on Express) which can be accessed via Browser
 - The front end is written in AngularJS
 - The references are stored in a local MariaDB database

## Citation queries

Queries are organized in a two-stage process:

 - One or multiple Pubmed ID's are queried
 - In a first stage, the ID's are searched in the local MariaDB Database
 - In a second stage, the unknown ID's are queried directly on [NCBI](https://www.ncbi.nlm.nih.gov/search/) 
 - Downloaded records are added to the database
 - The displayed results differentiates known and new datasets

 
## Usage of stored references

Query results are displayed together with export options for

 - Mediawiki format and
 - BibTex format

Upon selection of the provided format, the reference is copied into the 
clipboard.

A local directory for PDF's is maintained.
For every record, the presence of the referring PDF can be checked.
A link is provided, so that PDF's can directly be viewed in a Browser.

# Documentation

 - [NCBI Entrez](https://www.ncbi.nlm.nih.gov/books/NBK25499/)
 - [Europe PMC RESTful API](https://europepmc.org/RestfulWebService)
