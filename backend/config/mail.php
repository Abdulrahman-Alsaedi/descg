<?php

return [

    //'default' => env('MAIL_MAILER', 'mailgun'),
    'default' => env('MAIL_MAILER', 'resend'),


    'mailers' => [

        'resend' => [
            'transport' => 'resend',
        ],

        'mailgun' => [
            'transport' => 'mailgun',
        ],

        'smtp' => [
            'transport' => 'smtp',
            'host' => env('MAIL_HOST', 'smtp.mailgun.org'),
            'port' => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
            'local_domain' => env('MAIL_EHLO_DOMAIN'),
        ],

        'sendmail' => [
            'transport' => 'sendmail',
            'path' => '/usr/sbin/sendmail -bs',
        ],

        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],

        'array' => [
            'transport' => 'array',
        ],

        'failover' => [
            'transport' => 'failover',
            'mailers' => ['mailgun', 'log'],
        ],
    ],

    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'noreply@yourdomain.com'),
        'name' => env('MAIL_FROM_NAME', 'Your Project Name'),
    ],

    'markdown' => [
        'theme' => 'default',
        'paths' => [
            resource_path('views/vendor/mail'),
        ],
    ],

];
