# PantryPilot Deployment Guide

This document provides comprehensive instructions for deploying the PantryPilot application to Firebase. Follow these steps to ensure a successful deployment.

## Prerequisites

Before deploying, ensure you have the following:

1. **Node.js** (v14 or later) and **npm** installed
2. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```
3. A Firebase account and project created
4. Firebase CLI logged in to your account:
   ```bash
   firebase login
   ```
5. Firebase project configured (the `.firebaserc` file should contain your project ID)

## Deployment Steps

### 1. Prepare Security Rules

Ensure you have the correct security rules for Firestore and Storage:

```bash
# Copy the security rules from the firebase directory to the main directory
cp firebase/firestore.rules firestore.rules
cp firebase/storage.rules storage.rules
cp firebase/firestore.indexes.json firestore.indexes.json
```

### 2. Configure Firebase Hosting

Make sure your `firebase.json` file is properly configured to serve the React application from the `web/build` directory:

```json
{
  "hosting": {
    "public": "web/build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

The `rewrites` section is crucial for a React single-page application to handle client-side routing properly.

### 3. Build the Application

Build both the backend (Cloud Functions) and frontend (React) components:

```bash
# Build everything
npm run build

# Or build components separately
npm run build:functions  # Build Cloud Functions
npm run build:web        # Build React frontend
```

This will:
- Compile TypeScript to JavaScript for Cloud Functions
- Create an optimized production build of the React application

### 4. Deploy to Firebase

Deploy the entire application to Firebase:

```bash
firebase deploy
```

This command deploys:
- Firestore security rules and indexes
- Storage security rules
- Cloud Functions
- Frontend hosting

You can also deploy specific components:

```bash
# Deploy only Firestore rules and indexes
firebase deploy --only firestore

# Deploy only Cloud Functions
firebase deploy --only functions

# Deploy only hosting (frontend)
firebase deploy --only hosting
```

### 5. Populate the Database (First Deployment Only)

After the initial deployment, populate the Firestore database with sample data:

```bash
cd firestore-scripts
npm run populate
```

This script:
- Clears any existing collections
- Creates example users
- Creates grocery items
- Creates meals with ingredients

**Note:** This requires a `serviceAccountKey.json` file in the `firestore-scripts` directory. See the [FIRESTORE_SETUP.md](FIRESTORE_SETUP.md) file for instructions on obtaining this file.

### 6. Verify the Deployment

After deployment, verify that everything is working correctly:

1. Visit your Firebase Hosting URL (e.g., `https://your-project-id.web.app`)
2. Test user authentication (login/register)
3. Test grocery item management
4. Test meal planning features
5. Test shopping list functionality

## Troubleshooting

### Common Issues

1. **Default Firebase Hosting Page Shows Instead of Your App**
   - Ensure `firebase.json` has the correct `public` path pointing to `web/build`
   - Make sure you've built the React app before deploying
   - Check that the `rewrites` section is properly configured

2. **Cloud Functions Not Working**
   - Check Firebase Functions logs in the Firebase Console
   - Ensure the API URL in `web/src/services/api.ts` is correct
   - Verify that the Cloud Functions were built successfully

3. **Authentication Issues**
   - Ensure Firebase Authentication is enabled in the Firebase Console
   - Check that the Firebase configuration in `web/.env` is correct

4. **Database Access Issues**
   - Verify Firestore security rules are properly configured
   - Check that the user is authenticated when making database requests

## Maintenance

### Updating the Application

To update the application after making changes:

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the changes:
   ```bash
   firebase deploy
   ```

### Monitoring

Monitor your application using the Firebase Console:

- **Hosting**: View traffic, deployment history
- **Functions**: Check logs, execution times, error rates
- **Firestore**: Monitor database usage, query performance
- **Authentication**: Track user sign-ups and sign-ins

## Production Considerations

For a production environment, consider:

1. **Custom Domain**: Configure a custom domain in the Firebase Console
2. **Performance Monitoring**: Enable Firebase Performance Monitoring
3. **Error Tracking**: Set up Firebase Crashlytics or a similar service
4. **Analytics**: Implement Firebase Analytics for user behavior insights
5. **Backup Strategy**: Regularly export Firestore data for backup
6. **CI/CD Pipeline**: Set up automated testing and deployment

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
