--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `politics`
--

CREATE TABLE `politics` (
  `id` int(11) NOT NULL,
  `v_id` int(11) DEFAULT NULL,
  `congressman` int(11) DEFAULT NULL,
  `governor` int(11) DEFAULT NULL,
  `vicegov` int(11) DEFAULT NULL,
  `mayor` int(11) DEFAULT NULL,
  `op` int(11) DEFAULT NULL,
  `na` int(11) DEFAULT NULL,
  `status` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `politics`
--
ALTER TABLE `politics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `v_idx` (`v_id`),
  ADD KEY `congressmanx` (`congressman`),
  ADD KEY `governorx` (`governor`),
  ADD KEY `vicegovx` (`vicegov`),
  ADD KEY `mayor` (`mayor`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `politics`
--
ALTER TABLE `politics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;