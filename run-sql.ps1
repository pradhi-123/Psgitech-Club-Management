param(
  [string]$DBHost,
  [int]$Port = 5432,
  [string]$Database,
  [string]$User,
  [string]$SqlFile
)

if (-not $SqlFile) {
  Write-Host "Usage: .\run-sql.ps1 -DBHost <host> -Port <port> -Database <db> -User <user> -SqlFile <path>"
  exit 1
}

Write-Host "Running SQL file: $SqlFile against ${DBHost}:$Port/$Database as $User"
psql -h $DBHost -p $Port -U $User -d $Database -f $SqlFile
