# MSDP Location Service (Lambda)

Minimal HTTP API Lambda handler for location endpoints.

Build + Package:

- npm install
- npm run package → produces artifacts/location.zip

Terraform in msdp-devops-infrastructure/services/location references this zip by default (lambda_zip_path).

