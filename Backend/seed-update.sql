UPDATE pets SET
  collar = 'Blue collar with silver bell',
  identification_notes = 'White blaze on forehead, fluffy butt',
  vet_name = 'Dr. Linh Pham',
  last_vet_visit = DATE '2025-03-15',
  medications = 'Monthly flea & tick prevention',
  blood_type = 'DEA 1.1 Positive',
  vaccinated = true,
  allergies = 'No known allergies'
WHERE owner_id = 10 AND name = 'Bobby';

UPDATE pets SET
  collar = 'Pink collar with name tag',
  identification_notes = 'Long golden coat, white chest patch',
  vet_name = 'Dr. Linh Pham',
  last_vet_visit = DATE '2025-04-22',
  vaccinated = true
WHERE owner_id = 10 AND name = 'Luna';
