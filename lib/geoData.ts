export interface DistrictData {
  district: string;
  thanas: string[];
}

export const BANGLADESH_DISTRICTS: DistrictData[] = [
  // --- বরিশাল বিভাগ (Barishal Division) ---
  {
    district: 'Patuakhali',
    thanas: [
      'Patuakhali Sadar',
      'Bauphal',
      'Galachipa',
      'Kalapara',
      'Kuakata',
      'Mirzaganj',
      'Dumki',
      'Dashmina',
      'Rangabali',
    ],
  },
  {
    district: 'Barishal',
    thanas: [
      'Barishal Sadar (Kotwali)',
      'Bakerganj',
      'Babuganj',
      'Wazirpur',
      'Banaripara',
      'Gournadi',
      'Agailjhara',
      'Mehendiganj',
      'Muladi',
      'Hizla',
    ],
  },
  {
    district: 'Bhola',
    thanas: ['Bhola Sadar', 'Borhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Monpura', 'Tazumuddin'],
  },
  {
    district: 'Barguna',
    thanas: ['Barguna Sadar', 'Amtali', 'Betagi', 'Bamna', 'Patharghata', 'Taltali'],
  },
  {
    district: 'Jhalokathi',
    thanas: ['Jhalokathi Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
  },
  {
    district: 'Pirojpur',
    thanas: ['Pirojpur Sadar', 'Bhandaria', 'Mathbaria', 'Kawkhali', 'Nazirpur', 'Nesarabad (Swarupkati)', 'Indurkani'],
  },

  // --- ঢাকা বিভাগ (Dhaka Division) ---
  {
    district: 'Dhaka',
    thanas: [
      'Dhaka North City',
      'Dhaka South City',
      'Dhanmondi',
      'Mirpur',
      'Uttara',
      'Gulshan',
      'Banani',
      'Mohammadpur',
      'Badda',
      'Motijheel',
      'Paltan',
      'Tejgaon',
      'Jatrabari',
      'Khilgaon',
      'Savar',
      'Dhamrai',
      'Keraniganj',
      'Nawabganj',
      'Dohar',
    ],
  },
  {
    district: 'Gazipur',
    thanas: ['Gazipur Sadar', 'Joydebpur', 'Tongi', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj'],
  },
  {
    district: 'Narayanganj',
    thanas: ['Narayanganj Sadar', 'Fatullah', 'Siddhirganj', 'Bandar', 'Araihazar', 'Sonargaon', 'Rupganj'],
  },
  {
    district: 'Narsingdi',
    thanas: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'],
  },
  {
    district: 'Tangail',
    thanas: [
      'Tangail Sadar',
      'Basail',
      'Bhuapur',
      'Delduar',
      'Ghatail',
      'Gopalpur',
      'Kalihati',
      'Madhupur',
      'Mirzapur',
      'Nagarpur',
      'Sakhipur',
      'Dhanbari',
    ],
  },
  {
    district: 'Faridpur',
    thanas: ['Faridpur Sadar', 'Alfadanga', 'Bhangga', 'Boalmari', 'Charbhadrasan', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha'],
  },
  {
    district: 'Gopalganj',
    thanas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
  },
  {
    district: 'Kishoreganj',
    thanas: [
      'Kishoreganj Sadar',
      'Bajitpur',
      'Bhairab',
      'Hossainpur',
      'Itna',
      'Karimganj',
      'Katiadi',
      'Kuliarchar',
      'Mithamain',
      'Nikli',
      'Pakundia',
      'Tarail',
      'Ashtagram',
    ],
  },
  {
    district: 'Madaripur',
    thanas: ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar', 'Dasar'],
  },
  {
    district: 'Manikganj',
    thanas: ['Manikganj Sadar', 'Daulatpur', 'Ghior', 'Harirampur', 'Saturia', 'Shibalaya', 'Singair'],
  },
  {
    district: 'Munshiganj',
    thanas: ['Munshiganj Sadar', 'Gazaria', 'Lohajang', 'Sirajdikhan', 'Sreenagar', 'Tongibari'],
  },
  {
    district: 'Rajbari',
    thanas: ['Rajbari Sadar', 'Baliakandi', 'Goalandaghat', 'Pangsha', 'Kalukhali'],
  },
  {
    district: 'Shariatpur',
    thanas: ['Shariatpur Sadar', 'Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Zajira'],
  },

  // --- চট্টগ্রাম বিভাগ (Chattogram Division) ---
  {
    district: 'Chattogram',
    thanas: [
      'Chattogram City',
      'Agrabad',
      'Kotwali',
      'Panchlaish',
      'Halishahar',
      'Anwara',
      'Banshkhali',
      'Boalkhali',
      'Chandanaish',
      'Fatikchhari',
      'Hathazari',
      'Lohagara',
      'Mirsharai',
      'Patiya',
      'Rangunia',
      'Raozan',
      'Sandwip',
      'Satkania',
      'Sitakunda',
      'Karnafuli',
    ],
  },
  {
    district: "Cox's Bazar",
    thanas: ["Cox's Bazar Sadar", 'Chakaria', 'Kutubdia', 'Maheshkhali', 'Ramu', 'Teknaf', 'Ukhia', 'Pekua', 'Eidgaon'],
  },
  {
    district: 'Cumilla',
    thanas: [
      'Cumilla Adarsha Sadar',
      'Cumilla Sadar Dakshin',
      'Barura',
      'Brahmanpara',
      'Burichang',
      'Chandina',
      'Chauddagram',
      'Daudkandi',
      'Debidwar',
      'Homna',
      'Laksam',
      'Muradnagar',
      'Meghna',
      'Monohargonj',
      'Titas',
      'Lalmai',
    ],
  },
  {
    district: 'Feni',
    thanas: ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Fulgazi', 'Sonagazi'],
  },
  {
    district: 'Brahmanbaria',
    thanas: ['Brahmanbaria Sadar', 'Ashuganj', 'Bancharampur', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail', 'Akhaura', 'Bijoynagar'],
  },
  {
    district: 'Chandpur',
    thanas: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti'],
  },
  {
    district: 'Noakhali',
    thanas: ['Noakhali Sadar (Sudharam)', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Sonaimuri', 'Subarnachar', 'Kabirhat'],
  },
  {
    district: 'Lakshmipur',
    thanas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'],
  },
  {
    district: 'Bandarban',
    thanas: ['Bandarban Sadar', 'Ali Kadam', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi', 'Lama'],
  },
  {
    district: 'Khagrachhari',
    thanas: ['Khagrachhari Sadar', 'Dighinala', 'Lakshmichhari', 'Mahalchhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh', 'Guimara'],
  },
  {
    district: 'Rangamati',
    thanas: ['Rangamati Sadar', 'Baghaichhari', 'Barkal', 'Belaichhari', 'Juraichhari', 'Kaptai', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali'],
  },

  // --- খুলনা বিভাগ (Khulna Division) ---
  {
    district: 'Khulna',
    thanas: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsha', 'Terokhada'],
  },
  {
    district: 'Jashore',
    thanas: ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha (Benapole)'],
  },
  {
    district: 'Bagerhat',
    thanas: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
  },
  {
    district: 'Satkhira',
    thanas: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
  },
  {
    district: 'Kushtia',
    thanas: ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur'],
  },
  {
    district: 'Jhenaidah',
    thanas: ['Jhenaidah Sadar', 'Harinakunda', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa'],
  },
  {
    district: 'Chuadanga',
    thanas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar'],
  },
  {
    district: 'Magura',
    thanas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
  },
  {
    district: 'Meherpur',
    thanas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
  },
  {
    district: 'Narail',
    thanas: ['Narail Sadar', 'Kalia', 'Lohagara'],
  },

  // --- রাজশাহী বিভাগ (Rajshahi Division) ---
  {
    district: 'Rajshahi',
    thanas: ['Rajshahi Sadar (Boalia)', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Paba', 'Puthia', 'Tanore'],
  },
  {
    district: 'Bogura',
    thanas: ['Bogura Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatola'],
  },
  {
    district: 'Pabna',
    thanas: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'],
  },
  {
    district: 'Sirajganj',
    thanas: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullapara'],
  },
  {
    district: 'Naogaon',
    thanas: ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mohadevpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar'],
  },
  {
    district: 'Natore',
    thanas: ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra', 'Naldanga'],
  },
  {
    district: 'Chapai Nawabganj',
    thanas: ['Chapai Nawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj'],
  },
  {
    district: 'Joypurhat',
    thanas: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'],
  },

  // --- রংপুর বিভাগ (Rangpur Division) ---
  {
    district: 'Rangpur',
    thanas: ['Rangpur Sadar', 'Badarganj', 'Gangachhara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'],
  },
  {
    district: 'Dinajpur',
    thanas: ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Phulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'],
  },
  {
    district: 'Gaibandha',
    thanas: ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'],
  },
  {
    district: 'Kurigram',
    thanas: ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Nageshwari', 'Rajarhat', 'Raomari', 'Ulipur'],
  },
  {
    district: 'Lalmonirhat',
    thanas: ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram'],
  },
  {
    district: 'Nilphamari',
    thanas: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Syedpur'],
  },
  {
    district: 'Panchagarh',
    thanas: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
  },
  {
    district: 'Thakurgaon',
    thanas: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranisankail'],
  },

  // --- সিলেট বিভাগ (Sylhet Division) ---
  {
    district: 'Sylhet',
    thanas: ['Sylhet Sadar', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'South Surma', 'Osmani Nagar'],
  },
  {
    district: 'Habiganj',
    thanas: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniyachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Shayestaganj'],
  },
  {
    district: 'Moulvibazar',
    thanas: ['Moulvibazar Sadar', 'Barlekha', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal', 'Juri'],
  },
  {
    district: 'Sunamganj',
    thanas: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharampasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sullah', 'Tahirpur', 'Dakshin Sunamganj (Shantiganj)', 'Madhyanagar'],
  },

  // --- ময়মনসিংহ বিভাগ (Mymensingh Division) ---
  {
    district: 'Mymensingh',
    thanas: ['Mymensingh Sadar (Kotwali)', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gafargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal', 'Tara Khanda'],
  },
  {
    district: 'Jamalpur',
    thanas: ['Jamalpur Sadar', 'Baksiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
  },
  {
    district: 'Netrokona',
    thanas: ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala', 'Khaliajuri'],
  },
  {
    district: 'Sherpur',
    thanas: ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
  },
];