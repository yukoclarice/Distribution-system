--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `household_warding`
--

CREATE TABLE `household_warding` (
  `id` int(11) NOT NULL,
  `fh_v_id` int(11) DEFAULT NULL,
  `mem_v_id` int(11) DEFAULT NULL,
  `date_saved` varchar(45) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `household_warding`
--
ALTER TABLE `household_warding`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fh_v_id` (`fh_v_id`),
  ADD KEY `date_saved` (`date_saved`),
  ADD KEY `mem_v_id` (`mem_v_id`),
  ADD KEY `idx_household_warding_mem_v_id` (`mem_v_id`),
  ADD KEY `idx_householdwarding_mem_vid` (`mem_v_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `household_warding`
--
ALTER TABLE `household_warding`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;