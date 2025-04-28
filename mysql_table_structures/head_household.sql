--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `head_household`
--

CREATE TABLE `head_household` (
  `id` int(11) NOT NULL,
  `fh_v_id` int(11) DEFAULT NULL,
  `date_saved` varchar(45) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `leader_v_id` int(11) DEFAULT NULL,
  `purok_st` varchar(245) DEFAULT NULL,
  `verification_status` varchar(20) DEFAULT NULL,
  `is_printed` tinyint(4) NOT NULL DEFAULT 0,
  `is_Received` int(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `head_household`
--
ALTER TABLE `head_household`
  ADD PRIMARY KEY (`id`),
  ADD KEY `date_saved` (`date_saved`),
  ADD KEY `fh_v_id` (`fh_v_id`),
  ADD KEY `idx_head_household_fh_v_id` (`fh_v_id`),
  ADD KEY `idx_head_household_user_id` (`user_id`),
  ADD KEY `idx_headhousehold_fh_vid` (`fh_v_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `head_household`
--
ALTER TABLE `head_household`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;