<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your RentalOS Verification Code</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
               background: #f7fafc; margin: 0; padding: 40px 16px; color: #1a202c; }
        .card { max-width: 480px; margin: 0 auto; background: #fff;
                border-radius: 12px; overflow: hidden;
                box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: #0A1628; padding: 28px 32px; text-align: center; }
        .header h1 { color: #00D4AA; font-size: 20px; margin: 0; letter-spacing: 1px; }
        .body { padding: 36px 32px; text-align: center; }
        .greeting { font-size: 16px; margin-bottom: 8px; }
        .subtitle { color: #718096; font-size: 14px; margin-bottom: 32px; }
        .otp-box { display: inline-block; background: #f0fdf4; border: 2px solid #00D4AA;
                   border-radius: 12px; padding: 20px 40px; margin-bottom: 28px; }
        .otp { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0A1628; }
        .ttl { font-size: 13px; color: #718096; margin-bottom: 28px; }
        .warning { background: #fff5f5; border-radius: 8px; padding: 14px 20px;
                   font-size: 13px; color: #c53030; margin-bottom: 8px; }
        .footer { background: #f7fafc; border-top: 1px solid #e2e8f0;
                  padding: 20px 32px; text-align: center; font-size: 12px; color: #a0aec0; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>RENTALOS KENYA</h1>
        </div>
        <div class="body">
            <p class="greeting">Hi <strong>{{ $user->name }}</strong>,</p>
            <p class="subtitle">Use the verification code below to complete your registration.</p>

            <div class="otp-box">
                <div class="otp">{{ $otp }}</div>
            </div>

            <p class="ttl">This code expires in <strong>{{ $ttlMinutes }} minutes</strong>.</p>

            <div class="warning">
                🔒 Never share this code with anyone, including RentalOS staff.
            </div>
        </div>
        <div class="footer">
            RentalOS Kenya &bull; If you didn't request this, ignore this email.
        </div>
    </div>
</body>
</html>
