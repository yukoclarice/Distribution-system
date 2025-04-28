--
-- Database: `v_list`
--

-- --------------------------------------------------------

--
-- Table structure for table `userstbl`
--

CREATE TABLE `userstbl` (
  `user_id` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `fname` varchar(255) DEFAULT NULL,
  `mname` varchar(255) DEFAULT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `contact_no` varchar(45) DEFAULT NULL,
  `user_type` varchar(45) DEFAULT NULL,
  `status` varchar(45) DEFAULT NULL,
  `login_ip` varchar(45) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `v_id` int(11) DEFAULT NULL,
  `imgname` varchar(45) DEFAULT NULL,
  `remember` varchar(45) DEFAULT NULL,
  `login_token` varchar(45) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `userstbl`
--
ALTER TABLE `userstbl`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `userstbl`
--
ALTER TABLE `userstbl`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT;