--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `barangays`
--

CREATE TABLE `barangays` (
  `id` int(11) NOT NULL,
  `barangay` varchar(45) DEFAULT NULL,
  `municipality` varchar(45) DEFAULT NULL,
  `district` int(11) DEFAULT NULL,
  `households` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `barangays`
--
ALTER TABLE `barangays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_barangays_id` (`id`),
  ADD KEY `idx_barangays_brgy` (`barangay`),
  ADD KEY `idx_municipality` (`municipality`),
  ADD KEY `idx_barangays_municipality_barangay` (`municipality`,`barangay`),
  ADD KEY `idx_v_info_municipality_barangay` (`municipality`,`barangay`),
  ADD KEY `householdtotal` (`households`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `barangays`
--
ALTER TABLE `barangays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;