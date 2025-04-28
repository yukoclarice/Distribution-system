--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `v_imgtbl`
--

CREATE TABLE `v_imgtbl` (
  `id` int(11) NOT NULL,
  `v_id` int(11) NOT NULL,
  `imgname` longtext CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `type` int(11) DEFAULT NULL,
  `daterecorded` datetime DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `v_imgtbl`
--
ALTER TABLE `v_imgtbl`
  ADD PRIMARY KEY (`id`,`v_id`),
  ADD KEY `v_idx` (`v_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `v_imgtbl`
--
ALTER TABLE `v_imgtbl`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;