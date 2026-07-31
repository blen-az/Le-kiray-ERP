#!/usr/bin/env bash
# Database Restore Script for Le'Kiray ERP

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Backup file path required."
  echo "Usage: ./restore-db.sh /path/to/backup_file.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${CONTAINER_NAME:-lekiray_prod_postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-lekiray_erp}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

read -p "⚠️ WARNING: Restoring will overwrite existing data in '${DB_NAME}'. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore operation cancelled."
  exit 0
fi

echo "🔄 Restoring database '${DB_NAME}' from ${BACKUP_FILE}..."

gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "🎉 Database restoration completed successfully!"
