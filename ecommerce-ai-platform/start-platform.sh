#!/bin/bash
# Script khởi chạy Ecommerce AI Platform trên Linux/WSL/VPS

echo "=== KHỞI CHẠY ECOMMERCE AI PLATFORM ==="

cd "$(dirname "$0")"

# 1. Khởi chạy Core RAG (Dify)
echo "[1/3] Khởi chạy Core RAG (Dify) cổng 8080..."
docker compose -f core-rag/dify/docker/docker-compose.yaml up -d

# 2. Khởi chạy LiveKit Server & Web Reader
echo "[2/3] Khởi chạy LiveKit Server (7880) & DRM Web Reader (8088)..."
docker compose -f docker-compose.services.yaml up -d

echo "=== HỆ THỐNG ĐÃ SẴN SÀNG ==="
echo "Dify RAG Console:   http://localhost:8080"
echo "LiveKit Server:     ws://localhost:7880"
echo "DRM Web Reader:     http://localhost:8088"
echo "Voice Agent Client: http://localhost:3001"
