--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `governor`
--

CREATE TABLE `governor` (
  `id` int(11) NOT NULL,
  `FirstName` varchar(255) DEFAULT NULL,
  `LastName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `governor`
--
ALTER TABLE `governor`
  ADD PRIMARY KEY (`id`);