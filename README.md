# PantryPilot

PantryPilot is a web application for managing grocery shopping and meal planning. It allows users to create and manage grocery items, plan meals, and generate shopping lists.

## Features

- **User Authentication**: Secure login and registration using Firebase Authentication
- **Grocery Item Management**: Add, edit, and delete grocery items with details like category and unit
- **Shopping List**: Dynamically generated shopping list based on grocery items marked as "need to buy"
- **Meal Planning**: Create and manage meals with ingredients from your grocery items
- **Add to Shopping List**: Add all ingredients from a meal to your shopping list with one click

## Technology Stack

### Backend
- Firebase Cloud Functions (Node.js with TypeScript)
- Firebase Firestore (NoSQL database)
- Firebase Authentication
- Firebase Storage (for images)

### Frontend
- React with TypeScript
- React Router for navigation
- Firebase SDK for web

## Project Structure

```
pantry-pilot/
├── firebase/              # Firebase configuration files
├── functions/             # Cloud Functions backend
│   ├── src/               # TypeScript source code
│   │   ├── auth/          # Authentication functions
│   │   ├── items/         # Grocery item functions
│   │   ├── meals/         # Meal functions
│   │   └── shared/        # Shared utilities and types
│   └── tests/             # Unit tests
└── web/                   # React frontend
    ├── public/            # Static files
    └── src/               # React components and logic
        ├── components/    # Reusable UI components
        ├── context/       # React context providers
        ├── pages/         # Application pages
        └── services/      # Firebase service connections
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase account

### Setting Up the Project

#### Option 1: Using the Setup Script (Recommended)

1. **Clone the repository**

```bash
git clone https://github.com/krennt/pantry-pilot.git
cd pantry-pilot
```

2. **Run the setup script**

```bash
npm run setup
```

The setup script will:
- Install all dependencies
- Guide you through Firebase login and initialization
- Help you set up your Firebase configuration

#### Option 2: Manual Setup

1. **Clone the repository**

```bash
git clone https://github.com/krennt/pantry-pilot.git
cd pantry-pilot
```

2. **Install dependencies**

```bash
npm run install:all
```

3. **Set up Firebase**

```bash
# Login to Firebase
firebase login

# Initialize Firebase in the project
firebase init
```

During initialization, select:
- Firestore
- Functions
- Hosting
- Storage

4. **Create a .env file in the web directory**

Copy the .env.example file to .env and fill in your Firebase configuration:

```bash
cp web/.env.example web/.env
```

Then edit the web/.env file with your Firebase project configuration values.

### Running the Application Locally

1. **Start the Firebase emulators**

```bash
firebase emulators:start
```

This will start the Firestore, Functions, and Hosting emulators.

2. **Start the React development server**

```bash
cd web
npm start
```

The application will be available at http://localhost:3000.

### Deployment

To deploy the application to Firebase:

```bash
# Build the React application
cd web
npm run build

# Deploy to Firebase
cd ..
firebase deploy
```

## Testing

### Backend Tests

```bash
cd functions
npm test
```

### Frontend Tests

```bash
cd web
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
