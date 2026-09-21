export interface DistrictData {
  district: string;
  thanas: string[];
}

export const BANGLADESH_DISTRICTS: DistrictData[] = [
  // --- ঢাকা বিভাগ (১৩টি জেলা) ---
  {
    district: 'Dhaka',
    thanas: [
      'Adabor', 'Badda', 'Airport', 'Cantonment', 'Demra', 'Dhanmondi', 'Hazaribagh', 
      'Jatrabari', 'Kadamtali', 'Kafrul', 'Kalabagan', 'Kamrangirchar', 'Khilgaon', 
      'Khilkhet', 'Kotwali', 'Lalbagh', 'Mirpur', 'Mohammadpur', 'Motijheel', 'New Market', 
      'Pallabi', 'Paltan', 'Ramna', 'Rampura', 'Sabujbagh', 'Shah Ali', 'Shahbagh', 
      'Sher-e-Bangla Nagar', 'Shyampur', 'Sutrapur', 'Tejgaon', 'Tejgaon Industrial Area', 
      'Turag', 'Uttar Khan', 'Uttara', 'Vatara', 'Savar', 'Keraniganj', 'Dhamrai', 'Nawabganj', 'Dohar'
    ]
  },
  {
    district: 'Gazipur',
    thanas: ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur', 'Tongi', 'Pubail', 'Konabari', 'Kashimpur']
  },
  {
    district: 'Narayanganj',
    thanas: ['Araihazar', 'Bandar', 'Narayanganj Sadar', 'Rupganj', 'Sonargaon', 'Fatulla', 'Siddhirganj']
  },
  {
    district: 'Tangail',
    thanas: ['Tangail Sadar', 'Basail', 'Bhuapur', 'Delduar', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Dhanbari']
  },
  {
    district: 'Kishoreganj',
    thanas: ['Kishoreganj Sadar', 'Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karimganj', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail']
  },
  {
    district: 'Manikganj',
    thanas: ['Manikganj Sadar', 'Daulatpur', 'Ghior', 'Harirampur', 'Saturia', 'Shivalaya', 'Singair']
  },
  {
    district: 'Munshiganj',
    thanas: ['Munshiganj Sadar', 'Lohajang', 'Sirajdikhan', 'Sreenagar', 'Tongibari', 'Gazaria']
  },
  {
    district: 'Faridpur',
    thanas: ['Faridpur Sadar', 'Alfadanga', 'Bhanga', 'Boalmari', 'Charbhadrasan', 'Madhukhali', 'Nagarkanda', 'Sadarpur', 'Saltha']
  },
  {
    district: 'Gopalganj',
    thanas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara']
  },
  {
    district: 'Madaripur',
    thanas: ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar', 'Dasar']
  },
  {
    district: 'Rajbari',
    thanas: ['Rajbari Sadar', 'Baliakandi', 'Goalandaghat', 'Pangsha', 'Kalukhali']
  },
  {
    district: 'Shariatpur',
    thanas: ['Shariatpur Sadar', 'Bhedarganj', 'Damudya', 'Gosairhat', 'Naria', 'Zajira']
  },
  {
    district: 'Narsingdi',
    thanas: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Raipura', 'Shibpur', 'Palash']
  },

  // --- চট্টগ্রাম বিভাগ (১১টি জেলা) ---
  {
    district: 'Chattogram',
    thanas: [
      'Anwara', 'Banshkhali', 'Boalkhali', 'Chandanaish', 'Fatikchhari', 'Hathazari', 
      'Lohagara', 'Mirsharai', 'Patiya', 'Rangunia', 'Raozan', 'Sandwip', 'Satkania', 
      'Sitakunda', 'Bandar', 'Bayazid Bostami', 'Bakalia', 'Chandgaon', 'Double Mooring', 
      'EPZ', 'Halishahar', 'Karnafuli', 'Khulshi', 'Kotwali', 'Pahartali', 'Panchlaish', 
      'Sadarghat', 'Patenga', 'Doublemuring', 'Akbarshah', 'Bhujpur', 'Pahartali'
    ]
  },
  {
    district: "Cox's Bazar",
    thanas: ["Cox's Bazar Sadar", 'Chakaria', 'Kutubdia', 'Maheshkhali', 'Ramu', 'Teknaf', 'Ukhia', 'Pekua', 'Eidgah', 'Moheshkhali']
  },
  {
    district: 'Cumilla',
    thanas: ['Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Muradnagar', 'Nangalkot', 'Comilla Sadar', 'Meghna', 'Titas', 'Monohorgonj', 'Comilla Sadar South', 'Lalmai']
  },
  {
    district: 'Brahmanbaria',
    thanas: ['Brahmanbaria Sadar', 'Akhaura', 'Bancharampur', 'Kasba', 'Nabinagar', 'Nasirnagar', 'Sarail', 'Ashuganj', 'Bijoynagar']
  },
  {
    district: 'Chandpur',
    thanas: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab Dakshin', 'Matlab Uttar', 'Shahrasti']
  },
  {
    district: 'Noakhali',
    thanas: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Subarnachar', 'Sonaimuri', 'Kabirhat']
  },
  {
    district: 'Lakshmipur',
    thanas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar']
  },
  {
    district: 'Feni',
    thanas: ['Feni Sadar', 'Daganbhuiyan', 'Chhagalnaiya', 'Sonagazi', 'Parshuram', 'Fulgazi']
  },
  {
    district: 'Khagrachhari',
    thanas: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Laxmichhari', 'Mahalchhari', 'Manaikchhari', 'Ramgarh', 'Matiranga', 'Guimara']
  },
  {
    district: 'Rangamati',
    thanas: ['Rangamati Sadar', 'Belaichhari', 'Bagaichhari', 'Barkal', 'Juraichhari', 'Langadu', 'Nannerchar', 'Rajsthali', 'Kaptai']
  },
  {
    district: 'Bandarban',
    thanas: ['Bandarban Sadar', 'Alikadam', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi', 'Lama']
  },

  // --- রাজশাহী বিভাগ (৮টি জেলা) ---
  {
    district: 'Rajshahi',
    thanas: ['Bagha', 'Tanore', 'Paba', 'Puthia', 'Godagari', 'Mohanpur', 'Charghat', 'Durgapur', 'Boalia', 'Rajpara', 'Matihar', 'Shah Makhdum', 'Kashiadanga', 'Damkura']
  },
  {
    district: 'Bogura',
    thanas: ['Bogura Sadar', 'Adamdighi', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Sherpur', 'Shibganj', 'Sonatala']
  },
  {
    district: 'Natore',
    thanas: ['Natore Sadar', 'Bagatipara', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Singra', 'Naldanga']
  },
  {
    district: 'Naogaon',
    thanas: ['Naogaon Sadar', 'Atrai', 'Badalgachhi', 'Dhamoirhat', 'Manda', 'Mahadebpur', 'Niamatpur', 'Patnitala', 'Porsha', 'Raninagar', 'Sapahar']
  },
  {
    district: 'Chapainawabganj',
    thanas: ['Chapainawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj']
  },
  {
    district: 'Pabna',
    thanas: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar']
  },
  {
    district: 'Sirajganj',
    thanas: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Shahjadpur', 'Tarash', 'Ullahpara', 'Salanga']
  },
  {
    district: 'Joypurhat',
    thanas: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi']
  },

  // --- খুলনা বিভাগ (১০টি জেলা) ---
  {
    district: 'Khulna',
    thanas: ['Batiaghata', 'Dacope', 'Dumuria', 'Dighalia', 'Koyra', 'Paikgachha', 'Phultala', 'Rupsa', 'Terokhada', 'Daulatpur', 'Khalishpur', 'Khan Jahan Ali', 'Kotwali', 'Sonadanga', 'Harintana']
  },
  {
    district: 'Jashore',
    thanas: ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Jhikargachha', 'Keshabpur', 'Manirampur', 'Sharsha']
  },
  {
    district: 'Satkhira',
    thanas: ['Satkhira Sadar', 'Assassuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala']
  },
  {
    district: 'Narail',
    thanas: ['Narail Sadar', 'Kalia', 'Lohagara']
  },
  {
    district: 'Magura',
    thanas: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur']
  },
  {
    district: 'Jhenaidah',
    thanas: ['Jhenaidah Sadar', 'Harinakunda', 'Kaliganj', 'Kotchandpur', 'Shailkupa', 'Maheshpur']
  },
  {
    district: 'Kushtia',
    thanas: ['Kushtia Sadar', 'Bheramara', 'Kumarkhali', 'Khoksa', 'Mirpur', 'Daulatpur', 'Islami University']
  },
  {
    district: 'Chuadanga',
    thanas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar']
  },
  {
    district: 'Meherpur',
    thanas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar']
  },
  {
    district: 'Bagerhat',
    thanas: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola']
  },

  // --- বরিশাল বিভাগ (৬টি জেলা) ---
  {
    district: 'Barishal',
    thanas: ['Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Barishal Sadar', 'Mehendiganj', 'Muladi', 'Wazirpur', 'Kotwali', 'Bandar']
  },
  {
    district: 'Barguna',
    thanas: ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali']
  },
  {
    district: 'Bhola',
    thanas: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Lalmohan', 'Manpura', 'Tazumuddin', 'Daulatkhan']
  },
  {
    district: 'Jhalokati',
    thanas: ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur']
  },
  {
    district: 'Patuakhali',
    thanas: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali', 'Dumki', 'Kuakata']
  },
  {
    district: 'Pirojpur',
    thanas: ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad', 'Zianagar']
  },

  // --- সিলেট বিভাগ (৪টি জেলা) ---
  {
    district: 'Sylhet',
    thanas: ['Balaganj', 'Beani Bazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Sylhet Sadar', 'Zakiganj', 'South Surma', 'Airport']
  },
  {
    district: 'Moulvibazar',
    thanas: ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal']
  },
  {
    district: 'Habiganj',
    thanas: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Shayestaganj']
  },
  {
    district: 'Sunamganj',
    thanas: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharamapassa', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sullah', 'Tahirpur', 'South Sunamganj', 'Madhyanagar']
  },

  // --- রংপুর বিভাগ (৮টি জেলা) ---
  {
    district: 'Rangpur',
    thanas: ['Rangpur Sadar', 'Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj', 'Kotwali']
  },
  {
    district: 'Dinajpur',
    thanas: ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Bochaganj', 'Chirirbandar', 'Phulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur']
  },
  {
    district: 'Gaibandha',
    thanas: ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj']
  },
  {
    district: 'Kurigram',
    thanas: ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Rajarhat', 'Rowmari', 'Ulipur', 'Nageshwari']
  },
  {
    district: 'Lalmonirhat',
    thanas: ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram']
  },
  {
    district: 'Nilphamari',
    thanas: ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Saidpur']
  },
  {
    district: 'Panchagarh',
    thanas: ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia']
  },
  {
    district: 'Thakurgaon',
    thanas: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Ranisankail', 'Pirganj']
  },

  // --- ময়মনসিংহ বিভাগ (৪টি জেলা) ---
  {
    district: 'Mymensingh',
    thanas: ['Mymensingh Sadar', 'Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Nandail', 'Phulpur', 'Trishal', 'Kotwali']
  },
  {
    district: 'Jamalpur',
    thanas: ['Jamalpur Sadar', 'Baksiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari']
  },
  {
    district: 'Netrokona',
    thanas: ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Khaliajuri', 'Madan', 'Mohanganj', 'Purbadhala', 'Kendua', 'Barhatta']
  },
  {
    district: 'Sherpur',
    thanas: ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebordi']
  }
];