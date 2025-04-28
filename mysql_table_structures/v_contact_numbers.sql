--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `v_contact_numbers`
--

CREATE TABLE `v_contact_numbers` (
  `id` int(11) NOT NULL,
  `v_id` int(11) DEFAULT NULL,
  `contact_number` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `date_added` date DEFAULT current_timestamp(),
  `userid` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `v_contact_numbers`
--
ALTER TABLE `v_contact_numbers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `v_idx` (`v_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `v_contact_numbers`
--
ALTER TABLE `v_contact_numbers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;