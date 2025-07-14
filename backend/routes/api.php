<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Product Routes
Route::get('/products', [ProductController::class, 'index']);         // Get all products
Route::get('/products/{id}', [ProductController::class, 'show']);     // Get a specific product
Route::post('/products', [ProductController::class, 'store']);        // Create a new product
Route::put('/products/{id}', [ProductController::class, 'update']);   // Update a product
Route::delete('/products/{id}', [ProductController::class, 'destroy']);// Delete a product

// Auth Routes
Route::post('/register', [UserController::class, 'register']); // Register new user
Route::post('/login', [UserController::class, 'login']);       // Login user

// Authenticated Route to Get User Info
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
