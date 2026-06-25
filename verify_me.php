<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

App\Models\User::where('email', 'chinedufreedom10@gmail.com')->update([
    'email_verified' => 1,
    'email_verified_at' => now()
]);

echo "User verified successfully.\n";
