<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    public $type;

    public function __construct($otp, $type = 'registration')
    {
        $this->otp = $otp;
        $this->type = $type;
    }

    public function build()
    {
        $subject = match($this->type) {
            'password_reset' => 'Password Reset Code',
            'login' => 'Login Verification Code',
            default => 'Account Verification Code'
        };

        return $this->subject($subject)
                    ->view('emails.otp');
    }

}
