const DRIVERS = [
  { name: 'Ahmad K.', initials: 'AK', rating: '4.9', car: 'Toyota Prius · White', plate: '12-34567' },
  { name: 'Lina S.', initials: 'LS', rating: '4.8', car: 'Hyundai Ioniq · Silver', plate: '21-80412' },
  { name: 'Omar H.', initials: 'OH', rating: '4.9', car: 'Kia Niro EV · Blue', plate: '33-19045' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates the trip. Only ever called from the rider's explicit
 * "Confirm Ride" tap. Replace with a real POST to the booking API.
 */
export async function createTrip({ destination, fare, tierName }) {
  await sleep(1200);
  const driver = DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
  return {
    id: `PR-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    destination,
    fare,
    tierName,
    driver,
    pickupMinutes: 3 + Math.floor(Math.random() * 4),
  };
}
