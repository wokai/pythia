# Pythia

**Pythia** is named after Oracle of Delphi.
**Pythia** is a NodeJs Server (based on Express) for management of scientific literature:

 - Citation data is downloaded directly from [NCBI](https://www.ncbi.nlm.nih.gov/search/) from Pubmed ID's.
 - Citations are stored in a local (MongoDB) database
 - Local citations can be queried (Title full text)
 - Mediawiki references can be obtained from each citation via copy and paste

Additionally, (local) reference links to PDF's are maintained.
When article PDF's are stored in a configured directory using the PMID as
file name, the PDF are linked from **Pythia** search and the Mediawiki
reference.

# Documentation

 - [NCBI Entrez](https://www.ncbi.nlm.nih.gov/books/NBK25499/)
