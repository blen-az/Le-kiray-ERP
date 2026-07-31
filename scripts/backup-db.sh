#!/usr/bin/env bash
# Automated PostgreSQL Backup Script for Le'Kiray ERP

set -e

BACKUP_DIR="${BACKUP_DIR:-/opt/lekiray-erp/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="${CONTAINER_NAME:-lekiray_prod_postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-lekiray_erp}"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/lekiray_db_backup_${TIMESTAMP}.sql.gz"

echo "📦 Starting database backup for '${DB_NAME}' at ${TIMESTAMP}..."

# Execute pg_dump inside container and compress output
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "✅ Backup created successfully: ${BACKUP_FILE}"

# Remove backups older than RETENTION_DAYS
echo "🧹 Purging backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "lekiray_db_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm -f {} \;

echo "🎉 Backup process completed."
