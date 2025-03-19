# Troubleshooting Guide for Render Deployment

If you're experiencing issues with your SQL Generator application on Render, follow these steps to diagnose and fix common problems.

## Common Issues

### Gemini API Not Working

1. **Check Environment Variables**

   - Verify that `GEMINI_API_KEY` is correctly set in the Render dashboard
   - Go to Render Dashboard > Your Service > Environment
   - Make sure the API key is correct and not expired

2. **Validate API Key**

   - Test your API key locally to ensure it works
   - Check if there are any usage limits or restrictions on your Google AI Studio account

3. **Check Application Logs**
   - In Render Dashboard, go to your service and check the logs
   - Look for any error messages related to the Gemini API initialization

### Database Issues

1. **In-Memory Database Limitations**

   - Remember that the SQLite in-memory database resets when the service restarts
   - Any data you add will be lost on redeployment or when Render spins down your service

2. **Check Database Connection**
   - Visit `/health` endpoint to check database status
   - If database shows "not_initialized", the service might still be starting up

### Deployment Issues

1. **Health Check Failures**

   - Check if the health check is passing in the Render dashboard
   - Visit `/health` endpoint directly to see detailed diagnostics

2. **Run-time Errors**
   - Check application logs in the Render dashboard
   - Look for any error messages during application startup

## Checking Logs

To check logs on Render:

1. Go to your Render dashboard
2. Click on your web service
3. Navigate to the "Logs" tab
4. Look for error messages or warnings

## Environment Variables

Required environment variables:

- `GEMINI_API_KEY`: Your Google Gemini API key
- `PORT`: Set to 3000 (default for Render)
- `NODE_ENV`: Set to "production" for Render

## Contact Support

If you've tried all the troubleshooting steps and still have issues, contact Render support or open an issue on the GitHub repository.
