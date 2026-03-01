<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------
    // Register
    // -------------------------------------------------------

    public function test_user_can_register(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'John Tenant',
            'email'                 => 'john@example.com',
            'phone'                 => '0712345678',
            'role'                  => 'tenant',
            'password'              => 'Secret1234!',
            'password_confirmation' => 'Secret1234!',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('message', fn ($v) => str_contains($v, 'OTP'));

        $this->assertDatabaseHas('users', ['email' => 'john@example.com', 'role' => 'tenant']);
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        Mail::fake();
        $this->postJson('/api/auth/register', $this->validRegistrationData());

        $response = $this->postJson('/api/auth/register', $this->validRegistrationData());
        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_registration_rejects_admin_role(): void
    {
        Mail::fake();
        $data = array_merge($this->validRegistrationData(), ['role' => 'admin']);
        $this->postJson('/api/auth/register', $data)->assertStatus(422)->assertJsonValidationErrors('role');
    }

    // -------------------------------------------------------
    // OTP Verification
    // -------------------------------------------------------

    public function test_user_can_verify_otp_and_receive_token(): void
    {
        Mail::fake();
        $user = User::factory()->create(['role' => 'tenant', 'email_verified_at' => null]);
        $otp  = app(OtpService::class)->generate($user);

        $response = $this->postJson('/api/auth/verify-otp', [
            'user_id' => $user->id,
            'otp'     => $otp,
        ]);

        $response->assertOk()
                 ->assertJsonStructure(['success', 'message', 'data' => ['access_token', 'token_type', 'user']]);

        $this->assertDatabaseHas('users', [
            'id'  => $user->id,
            'otp' => null,
        ]);
    }

    public function test_expired_otp_is_rejected(): void
    {
        $user = User::factory()->create([
            'otp'            => '123456',
            'otp_expires_at' => now()->subMinutes(15),
        ]);

        $this->postJson('/api/auth/verify-otp', ['user_id' => $user->id, 'otp' => '123456'])
             ->assertStatus(422)
             ->assertJsonValidationErrors('otp');
    }

    public function test_wrong_otp_is_rejected(): void
    {
        $user = User::factory()->create([
            'otp'            => '999999',
            'otp_expires_at' => now()->addMinutes(5),
        ]);

        $this->postJson('/api/auth/verify-otp', ['user_id' => $user->id, 'otp' => '000000'])
             ->assertStatus(422);
    }

    // -------------------------------------------------------
    // Login
    // -------------------------------------------------------

    public function test_verified_user_can_login(): void
    {
        $user = User::factory()->create([
            'password'          => bcrypt('Secret1234!'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'Secret1234!',
        ]);

        $response->assertOk()->assertJsonStructure(['success', 'message', 'data' => ['access_token', 'user']]);
    }

    public function test_wrong_password_is_rejected(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrongpass'])
             ->assertStatus(422);
    }

    public function test_suspended_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'password'          => bcrypt('Secret1234!'),
            'email_verified_at' => now(),
            'is_suspended'      => true,
        ]);

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'Secret1234!'])
             ->assertStatus(403);
    }

    // -------------------------------------------------------
    // Logout & Me
    // -------------------------------------------------------

    public function test_authenticated_user_can_logout(): void
    {
        $user  = User::factory()->create(['email_verified_at' => now()]);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->postJson('/api/auth/logout')
             ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_me_returns_auth_user(): void
    {
        $user  = User::factory()->create(['email_verified_at' => now()]);
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->getJson('/api/auth/me')
             ->assertOk()
             ->assertJsonPath('data.email', $user->email);
    }

    // -------------------------------------------------------
    // Helpers
    // -------------------------------------------------------
    private function validRegistrationData(): array
    {
        return [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'phone'                 => '0700000000',
            'role'                  => 'tenant',
            'password'              => 'Secret1234!',
            'password_confirmation' => 'Secret1234!',
        ];
    }
}
