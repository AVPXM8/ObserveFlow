# ObserveFlow Deployment Guide

This guide provides step-by-step instructions for deploying ObserveFlow to a production environment (specifically AWS EC2).

## 1. Environment Variables Setup
The application uses `.env` files for configuration. Before deploying, create `.env` files based on the `.env.example` files provided in each service directory.

### Log Collector Service (`log-collector-service/.env`)
- `PORT`: Port for the API (default 5001).
- `MONGODB_URI`: Connection string for MongoDB.

### Alert Service (`alert-service/.env`)
- `PORT`: Port for the API (default 5002).
- `MONGODB_URI`: Connection string for MongoDB.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Credentials for sending email alerts.

## 2. AWS EC2 Deployment

### Step 1: Provision Instance
1. Launch an **EC2 Instance** (Ubuntu 22.04 LTS recommended).
2. Choose an instance size (t3.medium is recommended for the full stack).
3. **Security Group Configuration**:
   - Port 22: SSH Access
   - Port 3000: Frontend Dashboard
   - Port 5001: Log Collector API
   - Port 5002: Alert Service API

### Step 2: Install Docker & Docker Compose
Connect via SSH and run:
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 3: Clone and Configure
1. Clone the repository: `git clone <your-repo-url>`.
2. Navigate to the directory: `cd ObserveFlow`.
3. Create your `.env` files as described in Section 1.

### Step 4: Run with Docker Compose
```bash
# Build and start all services in detached mode
sudo docker-compose up --build -d
```

## 3. Monitoring & Maintenance
- **View Logs**: `sudo docker-compose logs -f [service_name]`
- **Check Status**: `sudo docker-compose ps`
- **Restart Services**: `sudo docker-compose restart`
