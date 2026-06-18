<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Client;
use App\Models\Order;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Admin::firstOrCreate(
            ['email' => 'admin@magerwa.rw'],
            [
                'full_name'   => 'Magerwa Administrator',
                'phone'       => '+250788000000',
                'national_id' => '1199000000000001',
                'password'    => Hash::make('password123'),
            ]
        );

        // Demo clients WITH login credentials.
        $loginClients = [
            ['Jean Bosco Habimana', '1199012345678901', '+250788111222', 'KN 4 Ave, Kigali',          'client@example.com'],
            ['Aline Uwase',         '1199087654321098', '+250788333444', 'KG 11 St, Gasabo',           'aline@example.com'],
            ['Patrick Niyonzima',   '1199055554443332', '+250788555666', 'Huye, Southern Province',    'patrick@example.com'],
        ];

        $clients = collect($loginClients)->map(fn ($c) => Client::firstOrCreate(
            ['national_id' => $c[1]],
            [
                'full_name'  => $c[0],
                'telephone'  => $c[2],
                'address'    => $c[3],
                'email'      => $c[4],
                'password'   => Hash::make('password123'),
                'created_by' => $admin->id,
            ]
        ));

        // [chassis, company, manufacturer, year, price, model_name, category, image_url]
        $vehicles = [
            ['JN1AZ4EH8DM430001', 'Mercedes-Benz', 'Daimler AG',    2023, 39000,  'CLA250 Luxury',     'Luxury',  '/assets/cars/mercedes_cla.jpg'],
            ['WVWZZZ1JZXW000002', 'Volkswagen',    'Volkswagen AG', 2022, 28500,  'Golf GTI Sport',    'Sport',   '/assets/cars/golf_gti.jpg'],
            ['JTDBR32E520000003', 'Toyota',        'Toyota Motor',  2021, 24000,  'Corolla Economy',   'Economy', '/assets/cars/corolla.jpg'],
            ['SALGA2EF9HA000004', 'Land Rover',    'JLR',           2023, 92000,  'Range Rover SUV',   'SUV',     '/assets/cars/range_rover.jpg'],
            ['JTHBP5C20A5000005', 'Lexus',         'Toyota Motor',  2024, 61000,  'IS 350 Luxury',     'Luxury',  '/assets/cars/lexus_is.jpg'],
            ['5YJ3E1EA7KF000006', 'Tesla',         'Tesla Inc',     2023, 47000,  'Model Y SUV',       'SUV',     '/assets/cars/model_y.jpg'],
            ['ZFF79ALA4J0000007', 'Ferrari',       'Ferrari S.p.A', 2022, 280000, 'Portofino Exotic',  'Exotic',  '/assets/cars/ferrari.jpg'],
            ['SAJWA0ES8DPS00008', 'Jaguar',        'JLR',           2021, 41000,  'XF P250SE Luxury',  'Luxury',  '/assets/cars/jaguar_xf.jpg'],
            ['1HGCV1F39LA000009', 'Honda',         'Honda Motor',   2020, 19500,  'Accord Economy',    'Economy', '/assets/cars/accord.jpg'],
            ['WP0AB2A99KS000010', 'Porsche',       'Porsche AG',    2024, 135000, '911 Carrera Sport', 'Sport',   '/assets/cars/porsche911.jpg'],
            ['WBA5A7C50FD000011', 'BMW',           'BMW AG',        2022, 52000,  '530i Luxury',       'Luxury',  '/assets/cars/bmw530.jpg'],
            ['1FTFW1ET5DFC00012', 'Ford',          'Ford Motor',    2021, 34000,  'F-150 SUV',         'SUV',     '/assets/cars/ford_f150.jpg'],
        ];

        $created = collect();
        foreach ($vehicles as $v) {
            $created->push(Vehicle::firstOrCreate(
                ['chassis_number' => $v[0]],
                [
                    'manufacture_company' => $v[1],
                    'manufacturer'        => $v[2],
                    'manufacture_year'    => $v[3],
                    'price'               => $v[4],
                    'model_name'          => $v[5],
                    'category'            => $v[6],
                    'image_url'           => $v[7],
                    'status'              => 'available',
                    'created_by'          => $admin->id,
                ]
            ));
        }

        // Demo pending orders so the admin dashboard has data.
        // Toyota Corolla reserved by Jean; Honda Accord reserved by Aline.
        $orderPairs = [
            [$clients[0], $created[2]],
            [$clients[1], $created[8]],
        ];

        foreach ($orderPairs as [$client, $vehicle]) {
            $exists = Order::where('client_id', $client->id)
                ->where('vehicle_id', $vehicle->id)
                ->exists();

            if (! $exists) {
                Order::create([
                    'client_id'  => $client->id,
                    'vehicle_id' => $vehicle->id,
                    'price'      => $vehicle->price,
                    'status'     => 'pending',
                ]);
                $vehicle->update(['status' => 'reserved']);
            }
        }
    }
}
