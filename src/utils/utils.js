const roles = [
    {
        name: "Site Administrator",
        value: "Site_Admin"
    },
    {
        name: "System Administrator",
        value: "System_Admin"
    },
    {
        name: "Location Administrator",
        value: "Location_Admin"
    },
    {
        name: "Location Supervisor",
        value: "Location_Super"
    },
    {
        name: "Counter User",
        value: "Counter_User"
    },
    {
        name: "Main Display User",
        value: "Main_Display_User"
    },
    {
        name: "Counter Display User",
        value: "Counter_Display_User"
    },
    {
        name: "Dispenser User",
        value: "Dispenser_User"
    }
];

const locations = [
    {
        name: 'State bank of America',
        sub_locations: [
            {
                name: 'SEA-California branch',
                id: '89c81ce7-b023-4315-adaa-3f9057f07d45'
            },
            {
                name: 'SEA-Texas branch',
                id: 'a368046e-dcd5-4cd5-bced-3e10dce0e2fe'
            }
        ]
    },
    {
        name: 'ABC Telco',
        sub_locations: [
            {
                name: 'Main Branch',
                id: 'a368046e-main-branch'
            }
        ]
    }
];

export {roles, locations};