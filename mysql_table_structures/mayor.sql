--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `mayor`
--

CREATE TABLE `mayor` (
  `id` int(11) NOT NULL,
  `FirstName` varchar(255) DEFAULT NULL,
  `LastName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `mayor`
--
ALTER TABLE `mayor`
  ADD PRIMARY KEY (`id`);