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
    public $ip;
    public $validUntil;


    public function __construct($otp)
    {
        $this->otp = $otp;
        $this->ip = request()->ip();
        $this->validUntil = now()->addMinutes(5)->format('h:i A');
    }

    public function build()
    {
        return $this->subject('Your OTP Code')
                    ->view('emails.otp')
                    ->text('emails.otp_text');
    }

}
