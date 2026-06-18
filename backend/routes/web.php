<?php

use Illuminate\Support\Facades\Route;

// Public
Route::view('/', 'landing');               // landing — browse without login
Route::view('/car', 'car');                // public vehicle detail (?id=)
Route::view('/login', 'client-auth');      // client login / register

// Client portal (client-side token guard)
Route::view('/portal', 'portal');

// Admin
Route::view('/admin', 'admin-auth');             // admin login
Route::view('/admin/dashboard', 'admin');        // admin dashboard
