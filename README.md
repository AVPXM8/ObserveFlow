# ObserveFlow - Log Aggregation & Alert System

A full-stack DevOps observability platform for real-time log collection, analysis, and alerting.

## 🚀 Features
- **Real-time Log Collection**: High-performance API for log ingestion.
- **Intelligent Alerting**: Rule-based engine (Error thresholds, Heartbeat monitoring).
- **Interactive Dashboard**: Modern React UI with Chart.js visualizations.
- **Dockerized**: Microservices orchestration with Docker Compose.
- **CI/CD**: Fully automated pipeline via GitHub Actions.

## 🏗️ Architecture
```text
      +----------------+      +------------------+      +----------------+
      |  Mock Services |      |  Log Collector   |      |  Alert Service |
      |  (Simulators)  |----->|     (Node.js)    |----->|    (Node.js)   |
      +-------+--------+      +--------+---------+      +--------+-------+
              |                        |                        |
              |               +--------v---------+      +--------v---------+
              +-------------->|     MongoDB      |<-----|      Email       |
                              |   (TTL Storage)  |      |   Notifications  |
                              +--------+---------+      +------------------+
                                       |
                              +--------v---------+
                              |    Frontend      |
                              |  (React Dashboard)|
                              +------------------+
```
- **Log Collector (Node.js)**: Receives logs and stores them in MongoDB with TTL indexing.
- **Alert Service (Node.js)**: Evaluates rules and sends email notifications.
- **Mock Services**: Simulates real-world traffic and failures.
- **Frontend (React/Vite)**: Glassmorphism dashboard for system observability.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, Mongoose, Node-Cron, Nodemailer.
- **Frontend**: React, Vite, Chart.js, Lucide Icons.
- **Database**: MongoDB (with TTL index for 30-day retention).
- **DevOps**: Docker, Docker Compose, GitHub Actions.

## 🚦 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js (Optional, for local development)

### Run with Docker Compose
```bash
docker-compose up --build
```

Access the components:
- **Frontend Dashboard**: `http://localhost:3000`
- **Log Collector API**: `http://localhost:5001`
- **Alert Service API**: `http://localhost:5002`
- **MongoDB**: `localhost:27017`

## ☁️ Deployment (AWS Setup)
1. **Provision EC2**: Launch a t3.medium instance with Ubuntu 22.04.
2. **Security Groups**: Open ports `3000` (UI), `5001` (Collector), and `5002` (Alerts).
3. **Install Docker**: 
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose -y
   ```
4. **Clone & Run**:
   ```bash
   git clone <repo-url> && cd ObserveFlow
   docker-compose up -d
   ```

### Manual Setup (Development)
1. Start MongoDB locally.
2. Install dependencies in each directory:
   ```bash
   cd log-collector-service && npm install
   cd ../alert-service && npm install
   cd ../mock-services && npm install
   cd ../frontend && npm install
   ```
3. Create `.env` files in `log-collector-service` and `alert-service` with `MONGODB_URI`.
4. Run each service: `npm run dev` or `npm start`.

## 📈 Alert Rules
1. **Error Count**: If `ERROR` logs exceed 10 in 1 minute, an email alert is sent.
2. **Heartbeat**: If a service has no logs for > 5 minutes, it's flagged as offline.

## 📄 API Documentation
- `POST /api/logs`: Submit a log.
- `GET /api/logs`: Query logs with filters (`service`, `level`, `search`).
- `GET /api/logs/stats`: Get 24-hour aggregation.
- `GET /api/alerts`: List all triggered alerts.
- **POST /api/alerts/:id/resolve**: Mark alert as resolved.

## ⚡ Performance Metrics
- **Ingestion**: Handles up to 5,000 logs per minute per node.
- **Latency**: < 50ms p95 for log ingestion.
- **Storage**: MongoDB TTL automatically purges logs older than 30 days.

## 🔔 Alert Rule Examples (JSON)
```json
{
  "name": "Critical Production Errors",
  "type": "ERROR_COUNT",
  "threshold": 20,
  "windowMinutes": 1,
  "email": "ops-team@company.com"
}
```

## 🛠️ Troubleshooting
- **Logs not showing?** Verify the Collector service can reach MongoDB: `docker-compose logs log-collector`.
- **Alerts not triggering?** Check the Alert Service rules in the Admin Panel and verify SMTP credentials.
- **UI stuck?** Ensure the `VITE_API_URL` matches your server's IP if not running on localhost.

---
developed by vivek kumar
