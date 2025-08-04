<?php

namespace App\Mail\Transports;

use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;
use Resend;
use Exception;
use GuzzleHttp\Client;

class ResendTransport extends AbstractTransport
{
    protected $client;
    protected $apiKey;

    public function __construct(string $apiKey)
    {
        parent::__construct();
        $this->apiKey = $apiKey;
        $this->client = new Client([
            'base_uri' => 'https://api.resend.com',
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json'
            ],
            'verify' => true // Enables SSL certificate verification
        ]);
    }

    protected function doSend(\Symfony\Component\Mailer\SentMessage $message): void
    {
        $email = $message->getOriginalMessage();
        
        if (!$email instanceof Email) {
            throw new \RuntimeException('Unsupported message type');
        }

        $payload = [
            'from' => $this->formatAddress($email->getFrom()[0]),
            'to' => array_map([$this, 'formatAddress'], $email->getTo()),
            'subject' => $email->getSubject(),
            'html' => $email->getHtmlBody(),
            'text' => $email->getTextBody()
        ];

        try {
            $response = $this->client->post('/emails', [
                'json' => $payload,
                'http_errors' => false // To handle errors manually
            ]);

            $body = json_decode($response->getBody()->getContents(), true);

            if ($response->getStatusCode() !== 200) {
                throw new \RuntimeException(
                    'Resend API Error: ' . ($body['message'] ?? 'Unknown error')
                );
            }

            \Log::debug('Resend API Success', [
                'email_id' => $body['id'] ?? null,
                'status' => $response->getStatusCode()
            ]);

        } catch (Exception $e) {
            \Log::error('Resend API Failed', [
                'error' => $e->getMessage(),
                'payload' => $payload
            ]);
            throw $e;
        }
    }

    private function formatAddress($address): string
    {
        return $address->getName() 
            ? "{$address->getName()} <{$address->getAddress()}>"
            : $address->getAddress();
    }

    public function __toString(): string
    {
        return 'resend';
    }
}