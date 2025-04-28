--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `congressman`
--

CREATE TABLE `congressman` (
  `id` int(11) NOT NULL,
  `FirstName` varchar(255) DEFAULT NULL,
  `LastName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `congressman`
--
ALTER TABLE `congressman`
  ADD PRIMARY KEY (`id`);