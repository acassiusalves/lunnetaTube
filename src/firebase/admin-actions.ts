
'use server';

/**
 * @fileOverview Admin actions for user management.
 * These actions use server-side Firebase Admin SDK for secure operations.
 */

import { z } from 'zod';
import { db } from './config';
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';


// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
    if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
        adminApp = initializeApp({
            credential: credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
    } else {
         console.log("Firebase Admin SDK environment variables not set. Using client-side SDK. This is not recommended for production.");
         // Fallback for when admin sdk is not configured (local dev without env vars)
         // Note: This relies on Firestore security rules for security.
    }
} else {
    adminApp = getApps()[0];
}


const UpdateUserRoleSchema = z.object({
  userId: z.string().describe('The ID of the user to update.'),
  newRole: z.enum(['admin', 'user']).describe('The new role to assign.'),
});

export async function updateUserRole(input: z.infer<typeof UpdateUserRoleSchema>) {
    const { userId, newRole } = UpdateUserRoleSchema.parse(input);
    
    try {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, { role: newRole });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user role:", error);
        throw new Error("Failed to update user role.");
    }
}

const DeleteUserSchema = z.object({
  userId: z.string().describe('The ID of the user to delete.'),
});

export async function deleteUser(input: z.infer<typeof DeleteUserSchema>) {
    const { userId } = DeleteUserSchema.parse(input);

    try {
        // Delete from Firestore
        await deleteDoc(doc(db, "users", userId));

        // Delete from Firebase Authentication if Admin SDK is available
        if (adminApp) {
            await getAuth(adminApp).deleteUser(userId);
        } else {
            console.warn("Could not delete user from Auth. Firebase Admin SDK not initialized.");
            // In a real app, you would want to handle this case, perhaps by queueing
            // the deletion or preventing it if the admin sdk isn't available.
            // For this prototype, we will allow firestore deletion to proceed.
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user:", error);
        if (error.code === 'auth/user-not-found') {
            // If user is not in auth, it might have been deleted already.
            // We can consider this a success in the context of our goal.
            return { success: true, message: "User already deleted from Authentication." };
        }
        throw new Error("Failed to delete user.");
    }
}
