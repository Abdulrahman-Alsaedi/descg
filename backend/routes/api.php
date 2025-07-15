<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

//Should retrieve data from database
Route::get('/products', ProductController::class . '@index');

Route::get('/products/{id}', ProductController::class . '@show');

// Create new product
Route::post('/products', ProductController::class . '@store');


// Update product
Route::put('/products/{id}', ProductController::class . '@update');

// Delete product
Route::delete('/products/{id}', ProductController::class . '@destroy');

// user registration
route::post('/user', UserController::class . '@register');

// AiDescriptionLog CRUD
use App\Http\Controllers\AiDescriptionLogController;
Route::get('/ai-description-logs', AiDescriptionLogController::class . '@index');
Route::get('/ai-description-logs/{id}', AiDescriptionLogController::class . '@show');
Route::post('/ai-description-logs', AiDescriptionLogController::class . '@store');
Route::put('/ai-description-logs/{id}',AiDescriptionLogController::class . '@update');
Route::delete('/ai-description-logs/{id}', AiDescriptionLogController::class . '@destroy');
Route::post('/ai-description-logs/generate/{id}', AiDescriptionLogController::class . '@generateDescription');