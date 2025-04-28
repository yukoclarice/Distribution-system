--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `v_info`
--

CREATE TABLE `v_info` (
  `v_id` int(11) NOT NULL,
  `barangayId` int(11) DEFAULT NULL,
  `v_precinct_no` varchar(45) DEFAULT NULL,
  `v_lname` varchar(145) DEFAULT NULL,
  `v_fname` varchar(145) DEFAULT NULL,
  `v_mname` varchar(45) DEFAULT NULL,
  `v_birthday` date DEFAULT NULL,
  `v_gender` varchar(15) DEFAULT NULL,
  `record_type` tinyint(4) DEFAULT NULL,
  `v_idx` varchar(45) NOT NULL,
  `date_recorded` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `v_info` also known as voters table
--
ALTER TABLE `v_info`
  ADD PRIMARY KEY (`v_id`),
  ADD KEY `index_fname` (`v_fname`),
  ADD KEY `index_lname` (`v_lname`),
  ADD KEY `index_mname` (`v_mname`),
  ADD KEY `v_idxxx` (`v_idx`),
  ADD KEY `idx_v_info_barangay_municipality` (`barangayId`),
  ADD KEY `idx_v_info_order` (`v_lname`,`v_mname`,`v_fname`),
  ADD KEY `idx_barangayId` (`barangayId`),
  ADD KEY `idx_v_info_barangayId` (`barangayId`),
  ADD KEY `idx_vinfo_vid` (`v_id`),
  ADD KEY `idx_vinfo_barangayId` (`barangayId`);
ALTER TABLE `v_info` ADD FULLTEXT KEY `ft_v_names` (`v_lname`,`v_fname`,`v_mname`);
ALTER TABLE `v_info` ADD FULLTEXT KEY `v_lname` (`v_lname`,`v_fname`,`v_mname`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `v_info`
--
ALTER TABLE `v_info`
  MODIFY `v_id` int(11) NOT NULL AUTO_INCREMENT;