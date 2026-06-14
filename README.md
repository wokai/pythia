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

## Usage of links to stored PDF

### Usage of PDF-links inside Pythia

In Pythia, a base directory for PDF dokuments is configured.
For every record, the presence of the referring PDF can be checked.
The PDF can be opened by clicking a link inside Pythia record.

### Usage of PDF-links inside Mediawiki

The Pythia-generated Mediawiki references contain a link to the referred
PDF-document inside the configured directory.
Ideally, these PDF contain the original document of the reference.

The user must copy the PDF from downloaded documents into the
configured directory using the correct filename.
The filename should be the Pubmed-Id (for example `12345678.pdf`).

From inside Mediawiki, the PDF can be viewed by clicking the link in the given
reference.

# Setup (Linux)

 - Download project into working directory
 - Execute `npm install` in base directory
 - Initialize MariaDB
     - Install MariaDB database
     - Create database, database-user and database table as shown in `initdb.sql`
 - Create `pdf.base` directory and make directory accessible for `www-data` user
 - Customize configuration
     - Copy `/config/config.js` into `/config/local.config.js`
     - Open `local.config.js`
     - Remove `try {} catch (e) {}` block in `local.config.js`
     - Update database-user and user-password in `local.config.js`
     - Update pdf.base in `local.config.js`

# Documentation

 - [NCBI Entrez](https://www.ncbi.nlm.nih.gov/books/NBK25499/)
 - [Europe PMC RESTful API](https://europepmc.org/RestfulWebService)
