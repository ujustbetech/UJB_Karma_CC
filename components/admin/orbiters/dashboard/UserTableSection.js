'use client';

import { useState, useMemo } from 'react';

import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import Input from '@/components/ui/Input';

import Table from '@/components/table/Table';
import TableHeader from '@/components/table/TableHeader';
import TableRow from '@/components/table/TableRow';

export default function UserTableSection({ users }) {
    const [search, setSearch] = useState('');

    const filteredUsers = useMemo(() => {
        if (!search) return users;

        const q = search.toLowerCase();

        return users.filter(u =>
            (u.Name || '').toLowerCase().includes(q) ||
            (u.UJBCode || '').toLowerCase().includes(q) ||
            (u.MobileNo || '').toLowerCase().includes(q) ||
            (u.Email || '').toLowerCase().includes(q) ||
            (u.City || '').toLowerCase().includes(q)
        );
    }, [search, users]);

    return (
        <Card className="p-4">
            <Text variant="h3" className="mb-3">
                Users Directory
            </Text>

            <Input
                placeholder="Search by Name / UJB / Mobile / City"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4"
            />

            <Table>

                <TableHeader
                    columns={[
                        { key: 'name', label: 'Name' },
                        { key: 'ujb', label: 'UJB Code' },
                        { key: 'mobile', label: 'Mobile' },
                        { key: 'city', label: 'City' },
                        { key: 'stage', label: 'Stage' },
                        { key: 'status', label: 'Subscription' },
                        { key: 'renewal', label: 'Renewal' },
                    ]}
                />

                {filteredUsers.map((u, i) => {
                    const renewal = u.subscription?.nextRenewalDate
                        ? new Date(u.subscription.nextRenewalDate).toLocaleDateString()
                        : '—';

                    return (
                        <TableRow
                            key={i}
                            cells={[
                                u.Name || '—',
                                u.UJBCode || u.ujbCode || '—',
                                u.MobileNo || '—',
                                u.City || '—',
                                u.BusinessStage || '—',
                                u.subscription?.status || '—',
                                renewal
                            ]}
                        />
                    );
                })}

            </Table>
        </Card>
    );
}
