--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `leaders`
--

CREATE TABLE `leaders` (
  `id` int(11) NOT NULL,
  `v_id` int(11) NOT NULL,
  `type` int(11) DEFAULT NULL,
  `electionyear` int(11) DEFAULT NULL,
  `dateadded` varchar(45) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `laynes` int(11) DEFAULT NULL,
  `is_printed` tinyint(4) NOT NULL DEFAULT 0,
  `is_Received` int(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `leaders`
--
ALTER TABLE `leaders`
  ADD PRIMARY KEY (`id`,`v_id`),
  ADD KEY `leadertype` (`type`),
  ADD KEY `idx_leaders_v_id_electionyear` (`v_id`,`electionyear`),
  ADD KEY `idx_leaders_vid` (`v_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `leaders`
--
ALTER TABLE `leaders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;