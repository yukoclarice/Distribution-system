--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `vice_governor`
--

CREATE TABLE `vice_governor` (
  `id` int(11) NOT NULL,
  `FirstName` varchar(255) DEFAULT NULL,
  `LastName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `vice_governor`
--
ALTER TABLE `vice_governor`
  ADD PRIMARY KEY (`id`);