FROM n8nio/n8n:latest

USER root

# Create workflows directory
RUN mkdir -p /etc/n8n/workflows

# Copy workflows and entrypoint script
COPY workflows/*.json /etc/n8n/workflows/
COPY entrypoint.sh /entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /entrypoint.sh

# Switch back to node user for security
USER node

ENTRYPOINT ["/entrypoint.sh"]
