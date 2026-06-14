/**
 * webhookService
 * 
 * Integrates with CI/CD systems to trigger automated reporting workflows.
 * Sends funnel state to external pipelines (GitHub Actions, GitLab CI, etc.)
 */

const CI_CD_WEBHOOK_URL = process.env.REACT_APP_CI_WEBHOOK_URL;
const CI_CD_TOKEN = process.env.REACT_APP_CI_TOKEN;
const CI_CD_PROVIDER = process.env.REACT_APP_CI_PROVIDER || 'github'; // github, gitlab, jenkins

/**
 * Trigger CI/CD pipeline with funnel state
 */
export const triggerPipeline = async (funnelState, options = {}) => {
  if (!CI_CD_WEBHOOK_URL) {
    console.warn('CI/CD webhook URL not configured');
    return { success: false, error: 'Webhook not configured' };
  }

  try {
    const payload = buildWebhookPayload(funnelState, options);
    
    const response = await fetch(CI_CD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CI_CD_TOKEN}`,
        'X-CI-PROVIDER': CI_CD_PROVIDER,
        'X-Webhook-Signature': generateSignature(JSON.stringify(payload)),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`CI/CD webhook error: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      runId: result.run_id || result.pipeline_id,
      url: result.html_url || result.web_url,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to trigger CI/CD pipeline:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Build webhook payload tailored to CI/CD provider
 */
const buildWebhookPayload = (funnelState, options) => {
  const basePayload = {
    event_type: 'desrg_funnel_report',
    timestamp: new Date().toISOString(),
    funnelState,
    config: {
      includeMetrics: options.includeMetrics !== false,
      includePredictions: options.includePredictions !== false,
      reportFormat: options.reportFormat || 'json', // json, html, pdf
      destination: options.destination || 'console', // console, email, slack, storage
    },
  };

  // Provider-specific payload formatting
  switch (CI_CD_PROVIDER) {
    case 'github':
      return {
        ref: options.branch || 'master',
        inputs: basePayload,
      };
    case 'gitlab':
      return {
        ref: options.branch || 'master',
        variables: basePayload,
      };
    case 'jenkins':
      return {
        parameter: Object.entries(basePayload).map(([name, value]) => ({
          name,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        })),
      };
    default:
      return basePayload;
  }
};

/**
 * Generate HMAC signature for webhook verification
 */
const generateSignature = (payload) => {
  if (typeof window === 'undefined') {
    // Server-side Node.js
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', CI_CD_TOKEN)
      .update(payload)
      .digest('hex');
  } else {
    // Browser-side (using Web Crypto API)
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const keyData = encoder.encode(CI_CD_TOKEN);
    // Note: Full implementation requires async/await or callback
    return 'signature-generation-requires-async';
  }
};

/**
 * Send report to external destination (email, Slack, S3, etc.)
 */
export const sendReport = async (funnelState, destination, format = 'json') => {
  try {
    const report = formatReport(funnelState, format);
    
    switch (destination) {
      case 'email':
        return await sendEmailReport(report);
      case 'slack':
        return await sendSlackReport(report);
      case 'storage':
        return await uploadToStorage(report);
      default:
        console.log('Report:', report);
        return { success: true };
    }
  } catch (error) {
    console.error('Failed to send report:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Format report based on type
 */
const formatReport = (funnelState, format) => {
  const { nodes, edges } = funnelState;
  const timestamp = new Date().toISOString();

  if (format === 'json') {
    return {
      generatedAt: timestamp,
      nodes,
      edges,
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        activeEdges: edges.filter((e) => e.isActive).length,
      },
    };
  }

  if (format === 'html') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>DESRG Report - ${timestamp}</title>
          <style>body { font-family: Arial; margin: 20px; }</style>
        </head>
        <body>
          <h1>Funnel Architecture Report</h1>
          <p>Generated: ${timestamp}</p>
          <h2>Nodes (${nodes.length})</h2>
          <ul>${nodes.map((n) => `<li>${n.label} (${n.type})</li>`).join('')}</ul>
          <h2>Connections (${edges.length})</h2>
          <ul>${edges.map((e) => `<li>${e.source} → ${e.target} ${e.isActive ? '(active)' : ''}</li>`).join('')}</ul>
        </body>
      </html>
    `;
  }

  return format;
};

/**
 * Send report via email
 */
const sendEmailReport = async (report) => {
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: process.env.REACT_APP_REPORT_EMAIL,
      subject: 'DESRG Funnel Report',
      html: typeof report === 'string' ? report : JSON.stringify(report, null, 2),
    }),
  });
  return response.json();
};

/**
 * Send report to Slack
 */
const sendSlackReport = async (report) => {
  const response = await fetch(process.env.REACT_APP_SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: '📊 DESRG Funnel Report Generated',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Funnel Report*\n\`\`\`${JSON.stringify(report, null, 2)}\`\`\``,
          },
        },
      ],
    }),
  });
  return response.json();
};

/**
 * Upload report to cloud storage (S3, GCS, etc.)
 */
const uploadToStorage = async (report) => {
  const key = `reports/desrg-${Date.now()}.json`;
  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      data: typeof report === 'string' ? report : JSON.stringify(report),
      bucket: process.env.REACT_APP_STORAGE_BUCKET,
    }),
  });
  return response.json();
};

/**
 * Register webhook listener for CI/CD events
 */
export const registerWebhookListener = async (endpoint) => {
  try {
    const response = await fetch('/api/webhooks/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        events: ['funnel.updated', 'metrics.changed'],
      }),
    });
    return response.json();
  } catch (error) {
    console.error('Failed to register webhook:', error);
    return { success: false, error: error.message };
  }
};
