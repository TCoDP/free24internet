<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * После bootstrap приложения: не даём тестам (трейт RefreshDatabase → migrate:fresh и т.п.) уйти в «боевую» схему по ошибке.
     *
     * Во всех Feature-тестах используйте трейт DatabaseTransactions: после теста откатывается транзакция,
     * таблицы не удаляются, migrate:fresh не вызывается.
     * Трейт RefreshDatabase на общей MySQL к этому проекту не подключайте.
     *
     * @see https://laravel.com/docs/testing#resetting-the-database-after-each-test
     */
    protected function refreshApplication()
    {
        parent::refreshApplication();

        if (! $this->app->runningUnitTests()) {
            return;
        }

        if ($this->destructiveTestsOnPrimaryDatabaseAllowed()) {
            return;
        }

        $connection = (string) $this->app['config']->get('database.default');
        /** @var array{driver?: string, database?: string|null} $cfg */
        $cfg = $this->app['config']->get("database.connections.{$connection}", []);
        $driver = (string) ($cfg['driver'] ?? '');
        $database = (string) ($cfg['database'] ?? '');

        if ($this->databaseLooksSafeForMigrateFresh($driver, $database)) {
            return;
        }

        throw new \RuntimeException(
            'Тесты остановлены: текущая БД ['.$database.'] на драйвере ['.$driver.'] не считается выделенной под тесты '
            .'(нужно имя, оканчивающееся на _test или _testing, либо sqlite :memory:, либо файл *testing.sqlite). '
            .'Укажите отдельную схему в phpunit.xml (например DB_DATABASE=vpn_bot_test) или задайте '
            .'ALLOW_DESTRUCTIVE_TESTS_ON_PRIMARY_DB=true только если осознанно гоняете тесты против этой базе.'
        );
    }

    private function destructiveTestsOnPrimaryDatabaseAllowed(): bool
    {
        $flag = $_ENV['ALLOW_DESTRUCTIVE_TESTS_ON_PRIMARY_DB']
            ?? getenv('ALLOW_DESTRUCTIVE_TESTS_ON_PRIMARY_DB');

        return filter_var($flag, FILTER_VALIDATE_BOOL);
    }

    private function databaseLooksSafeForMigrateFresh(string $driver, string $database): bool
    {
        if ($driver === 'sqlite' && ($database === ':memory:' || $database === '')) {
            return true;
        }

        if ($driver === 'sqlite' && str_ends_with($database, 'testing.sqlite')) {
            return true;
        }

        return (bool) preg_match('/_test(ing)?$/i', $database);
    }
}
